#!/usr/bin/env ruby

require 'nokogiri'
require 'json'

doc = Nokogiri::XML(open(ARGV[0]))

pts = []

doc.css('coordinates').each do |pt|
  components = pt.text.split(',').map(&:to_f)
  next if components.length > 3

  pts << { lat: components[1], lng: components[0] }
end

puts JSON.pretty_generate(pts)
