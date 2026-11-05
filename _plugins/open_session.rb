require "time"
require "uri"
require "fileutils"

module FluidsBench
  module OpenSession
    def self.phase(start_time, end_time, now)
      return "ended" if now >= end_time
      now >= start_time ? "live" : "upcoming"
    end

    def self.ical_text(value)
      value.to_s.gsub(/[\\,;]/) { |char| "\\#{char}" }.gsub(/\r\n|\r|\n/) { "\\n" }
    end

    # RFC 5545 folds at 75 octets, without splitting a UTF-8 character.
    def self.fold_line(line)
      lines = [""]
      line.each_char do |char|
        lines << " " if lines.last.bytesize + char.bytesize > 75
        lines[-1] += char
      end
      lines.join("\r\n")
    end

    def self.calendar(event, starts, ends, stamp, page_url)
      details = "#{event.fetch('description')}\n\nJoin Microsoft Teams: #{event.fetch('join_url')}\n" \
        "Meeting ID: #{event.fetch('meeting_id')}\nPasscode: #{event.fetch('passcode')}\n\nDetails: #{page_url}"
      lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FluidsBench//Open Session//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT", "UID:#{event.fetch('uid')}", "DTSTAMP:#{stamp.getutc.strftime('%Y%m%dT%H%M%SZ')}",
        "DTSTART:#{starts.utc.strftime('%Y%m%dT%H%M%SZ')}", "DTEND:#{ends.utc.strftime('%Y%m%dT%H%M%SZ')}",
        "SUMMARY:#{ical_text(event.fetch('title'))}", "DESCRIPTION:#{ical_text(details)}", "LOCATION:Microsoft Teams",
        "URL:#{page_url}", "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR"]
      lines.map { |line| fold_line(line) }.join("\r\n") + "\r\n"
    end

    def self.prepare(data, now, page_url)
      starts, ends = %w[starts_at ends_at].map do |key|
        value = data.fetch(key)
        raise ArgumentError, "#{key} must include a timezone" unless value.match?(/(?:Z|[+-]\d\d:\d\d)\z/)
        Time.iso8601(value).utc
      end
      raise ArgumentError, "session must end after it starts" unless ends > starts
      join = URI.parse(data.fetch("join_url"))
      raise ArgumentError, "expected the public Teams join link" unless join.scheme == "https" && join.host == "teams.microsoft.com" && join.path.start_with?("/meet/", "/l/meetup-join/")
      event = data.merge("phase" => phase(starts, ends, now), "date_label" => starts.strftime("%A %-d %B %Y"),
        "short_date_label" => starts.strftime("%a %-d %b"), "time_label" => "#{starts.strftime('%H:%M')}–#{ends.strftime('%H:%M')} GMT / UTC")
      event["time_zones"] = data.fetch("time_zones").map do |zone|
        zone.merge("time_label" => "#{starts.getlocal(zone.fetch('offset')).strftime('%H:%M')}–#{ends.getlocal(zone.fetch('offset')).strftime('%H:%M')}")
      end
      event["agenda"] = data.fetch("agenda").map do |item|
        first = starts + item.fetch("offset_minutes") * 60
        last = first + item.fetch("duration_minutes") * 60
        raise ArgumentError, "agenda item outside session" unless first >= starts && last <= ends && last > first
        item.merge("time_label" => "#{first.strftime('%H:%M')}–#{last.strftime('%H:%M')}")
      end
      details = "#{data.fetch('description')}\n\nJoin Microsoft Teams: #{data.fetch('join_url')}\n\nDetails: #{page_url}"
      event["google_calendar_url"] = "https://calendar.google.com/calendar/r/eventedit?" + URI.encode_www_form(
        "action" => "TEMPLATE", "text" => data.fetch("title"), "dates" => "#{starts.strftime('%Y%m%dT%H%M%SZ')}/#{ends.strftime('%Y%m%dT%H%M%SZ')}",
        "stz" => "Europe/London", "etz" => "Europe/London", "details" => details, "location" => "Microsoft Teams")
      event["outlook_calendar_url"] = "https://outlook.office.com/calendar/0/deeplink/compose?" + URI.encode_www_form(
        "path" => "/calendar/action/compose", "rru" => "addevent", "subject" => data.fetch("title"), "startdt" => starts.iso8601,
        "enddt" => ends.iso8601, "allday" => "false", "body" => details, "location" => "Microsoft Teams")
      [event, calendar(event, starts, ends, now, page_url)]
    end
  end

  if defined?(Jekyll::Generator)
    class OpenSessionGenerator < Jekyll::Generator
      safe true
      priority :normal

      def generate(site)
        return if site.config["release_snapshot"]
        data = site.data["open_session"]
        return unless data
        page_url = site.config.fetch("url") + site.config["baseurl"].to_s + data.fetch("path")
        event, ical = OpenSession.prepare(data, site.time, page_url)
        site.config["open_session"] = event
        site.config["open_session_ical"] = ical
        path = data.fetch("calendar_path")
        page = Jekyll::PageWithoutAFile.new(site, site.source, File.dirname(path).sub(%r{\A/}, ""), File.basename(path))
        page.content = ical
        page.data = { "layout" => nil, "sitemap" => false, "render_with_liquid" => false }
        site.pages << page
      rescue ArgumentError, KeyError => error
        raise Jekyll::Errors::FatalException, "FluidsBench open session: #{error.message}"
      end
    end

    # Jekyll's page renderer normalizes line endings. Calendar files require CRLF.
    Jekyll::Hooks.register :site, :post_write do |site|
      event = site.config["open_session"]
      ical = site.config["open_session_ical"]
      next unless event && ical
      destination = File.join(site.dest, event.fetch("calendar_path").sub(%r{\A/}, ""))
      FileUtils.mkdir_p(File.dirname(destination))
      File.binwrite(destination, ical)
    end
  end
end
