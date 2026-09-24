# Publication state is resolved before rendering; the countdown never reveals results.
require "time"
require "uri"

module FluidsBench
  class Launch < Jekyll::Generator
    safe true
    priority :low

    def reject!(message)
      raise Jekyll::Errors::FatalException, "FluidsBench launch: #{message}"
    end

    def add_committee_review(site)
      return unless site.config["committee_review"] == true

      hosted_preview = site.config["preview_mode"] == true &&
        site.config["url"] == "https://fluidsbench.org" &&
        site.config["baseurl"] == "/review-x4n7q9m2vk6p"
      reject!("committee review is allowed only in the hosted dev preview") unless hosted_preview
      home = site.pages.find { |page| page.data["permalink"] == "/" }
      reject!("committee review requires the leaderboard page") unless home

      # Reuse the same template and chart configuration before prelaunch hides them on home.
      review = Jekyll::PageWithoutAFile.new(site, site.source, "committee-leaderboard", "index.html")
      review.content = home.content
      review.data = home.data.merge(
        "permalink" => "/committee-leaderboard/",
        "committee_review" => true,
        "title" => "Leaderboard review",
        "description" => "Unlisted committee preview of the FluidsBench leaderboard. Prototype results for review.",
        "nav" => false,
        "sitemap" => false
      )
      site.pages << review
    end

    def generate(site)
      launch = site.data.fetch("launch", {}).merge(site.config.fetch("launch", {}))
      phase = launch["phase"]
      reject!("unknown phase #{phase.inspect}") unless %w[announced collecting reviewing live].include?(phase)
      dates = %w[opens_at cutoff_at reveal_at].map do |key|
        value = launch[key].to_s
        reject!("#{key} must include an explicit timezone") unless value.match?(/(?:Z|[+-]\d\d:\d\d)\z/)
        begin
          Time.iso8601(value)
        rescue ArgumentError
          reject!("invalid #{key}")
        end
      end
      reject!("dates must be ordered opening < cutoff < reveal") unless dates[0] < dates[1] && dates[1] < dates[2]
      status = site.data.fetch("submission_status", {})
      reject!("availability must match submission_source_ref") unless status["source_commit"] == site.config["submission_source_ref"]

      review_only = launch["review_only"] == true
      if review_only
        local = %w[localhost 127.0.0.1 ::1].include?(URI.parse(site.config["url"].to_s).host)
        reject!("review_only is allowed only in a local preview") unless local && site.config["local_ux_preview"] && site.config["preview_mode"]
      end
      live = phase == "live"
      if live && !review_only
        release = status.fetch("release", {})
        reject!("live requires confirmed dates") unless launch["dates_confirmed"] == true
        reject!("live requires the selected official release") unless release["status"] == "official" && release["id"] == launch["release_id"] && !launch["release_id"].to_s.empty?
        reject!("live requires immutable release assets") unless release["asset_base_url"].to_s.start_with?("https://") && release["archive_url"].to_s.start_with?("https://")
        asset = URI.parse(release["asset_base_url"])
        reject!("live asset URL must end with the release ID") unless asset.path.end_with?("/#{release['id']}/") && asset.query.nil? && asset.fragment.nil?
        reject!("live must use the selected release asset URL") unless site.config["leaderboard_base_url"] == release["asset_base_url"]
        reject!("live must pin the selected manifest digest") unless site.config["leaderboard_manifest_sha256"] == status["manifest_sha256"]
      end

      launch["leaderboard_visible"] = live
      launch["accepting_submissions"] = %w[collecting reviewing live].include?(phase)
      display = site.data.fetch("leaderboard_display", {})
      launch["open_count"] = status.fetch("datasets", {}).count do |slug, item|
        item["open"] == true && !display.fetch(slug, {})["hidden"] && !display.fetch(slug, {})["coming_soon"]
      end
      launch["can_submit"] = launch["accepting_submissions"] && launch["open_count"] > 0
      launch["deadline_passed"] = site.time >= dates[1]
      launch["reveal_passed"] = site.time >= dates[2]
      site.config["launch"] = launch

      add_committee_review(site)
      site.pages.each do |page|
        dataset_id = page.data["dataset_id"]
        if display.fetch(dataset_id, {})["coming_soon"]
          name = site.data.fetch("dataset_catalog", {}).fetch(dataset_id).fetch("name")
          page.data["title"] = "#{name} — Coming soon"
          page.data["page_title"] = "#{name} — Coming soon"
          page.data["page_description"] = "This benchmark is in preparation."
          page.data["description"] = "#{name} is coming soon to FluidsBench."
        end
        if page.data["permalink"] == "/"
          page.data["chart"] = {} unless live
          page.data["description"] = "Assess physics AI surrogate models across realistic fluid dynamics datasets. Prepare your model for the first FluidsBench leaderboard release." unless live
        end
      end
      # Retired standalone demos bypass the publication state and release provenance.
      legacy = %r{\A/?(?:leaderboards/|assets/(?:html|jupyter|plotly)/)}
      site.static_files.reject! { |file| file.relative_path.match?(legacy) }
      site.pages.reject! { |page| page.relative_path.match?(legacy) || page.url.to_s.match?(legacy) }
    end
  end
end
