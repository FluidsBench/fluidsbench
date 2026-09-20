#!/usr/bin/env ruby
# Exercise the actual Jekyll generator without loading the full theme dependency tree.
require "json"
require "yaml"
require "ostruct"

module Jekyll
  class Generator
    def self.safe(*) = nil
    def self.priority(*) = nil
  end
  module Errors
    class FatalException < StandardError; end
  end
end
require_relative "../_plugins/launch"

ROOT = File.expand_path("..", __dir__)

def site_for(phase = "announced")
  data = {
    "launch" => YAML.load_file(File.join(ROOT, "_data/launch.yml")),
    "submission_status" => JSON.parse(File.read(File.join(ROOT, "_data/submission_status.json")))
  }
  config = {
    "launch" => { "phase" => phase }, "url" => "https://fluidsbench.org",
    "submission_source_ref" => data["submission_status"]["source_commit"],
    "preview_mode" => true
  }
  page = OpenStruct.new(data: { "permalink" => "/", "chart" => { "chartjs" => true } }, relative_path: "_pages/leaderboard.md")
  OpenStruct.new(data: data, config: config, pages: [page], static_files: [], time: Time.utc(2026, 9, 20))
end

def check(condition, message)
  abort("ERROR: #{message}") unless condition
end

def rejected(site, message)
  begin
    FluidsBench::Launch.new.generate(site)
  rescue Jekyll::Errors::FatalException
    return
  end
  abort("ERROR: #{message}")
end

# A closed dataset cannot become open merely because the campaign phase or clock changes.
%w[announced collecting reviewing].each do |phase|
  site = site_for(phase)
  site.data["submission_status"]["datasets"].each_value { |value| value["open"] = false }
  site.time = Time.utc(2027, 1, 1)
  FluidsBench::Launch.new.generate(site)
  check(!site.config["launch"]["leaderboard_visible"], "clock expiry published the board")
  check(!site.config["launch"]["can_submit"], "closed datasets became submittable")
  check(site.pages[0].data["chart"] == {}, "prelaunch loaded chart dependencies")
end

# Ready datasets can accept entries without exposing a leaderboard, including after cutoff.
%w[collecting reviewing].each do |phase|
  site = site_for(phase)
  site.data["submission_status"]["datasets"].values.first["open"] = true
  FluidsBench::Launch.new.generate(site)
  check(site.config["launch"]["can_submit"], "ready datasets cannot accept #{phase} submissions")
  check(!site.config["launch"]["leaderboard_visible"], "accepting a submission published rankings")
end

site = site_for("live")
rejected(site, "prototype release was allowed to go live")
site = site_for
site.config["submission_source_ref"] = "main"
rejected(site, "stale availability was accepted")
site = site_for
site.config["launch"]["cutoff_at"] = "2026-12-01T00:00:00Z"
rejected(site, "cutoff after reveal was accepted")
site = site_for
site.config["launch"]["reveal_at"] = "2026-11-24T15:00:00"
rejected(site, "timezone-free date was accepted")
site = site_for("invalid")
rejected(site, "unknown phase was accepted")

# Development-only access is a local build option, never a public URL parameter.
site = site_for("live")
site.config["launch"]["review_only"] = true
site.config["local_ux_preview"] = true
rejected(site, "public preview allowed the local-only bypass")
site.config["url"] = "http://127.0.0.1:8088"
FluidsBench::Launch.new.generate(site)
check(site.config["launch"]["leaderboard_visible"], "local leaderboard review failed")

# A selected official immutable release is required for public live mode.
site = site_for("live")
status = site.data["submission_status"]
status["release"] = { "id" => "first-2026", "status" => "official", "asset_base_url" => "https://example.test/first-2026/", "archive_url" => "https://example.test/archive/first-2026" }
site.config["launch"].merge!({ "dates_confirmed" => true, "release_id" => "first-2026" })
site.config["leaderboard_base_url"] = status["release"]["asset_base_url"]
site.config["leaderboard_manifest_sha256"] = status["manifest_sha256"]
FluidsBench::Launch.new.generate(site)
check(site.config["launch"]["leaderboard_visible"], "official pinned release cannot go live")
site.config["leaderboard_manifest_sha256"] = "0" * 64
rejected(site, "wrong release digest was accepted")

puts "Launch phases, publication gates, dataset independence and local review checks passed."
