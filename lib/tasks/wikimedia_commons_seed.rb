require "net/http"
require "uri"
require 'nokogiri'
require 'open-uri'


module Seed
  class WikimediaCommonsSeed
    
    class << self 
      def fetch_and_parse_page path
        url = URI.parse(path)

        req = Net::HTTP::Get.new(url.path)	 
        response = Net::HTTP.new(url.host, url.port).start do |http|
          http.request(req)
        end

        noko = Nokogiri::HTML.parse(response.body, nil, 'utf-8r2e')

        page = noko.css("#mw-category-media > a")[1].attr('href')
        files = []
        noko.css("#mw-category-media .gallery .gallerytext a").each do |el|
          files << {path: el.attr("href"), name: el.attr("title")[5..-1]}
        end
        return {
          page: page,
          files: files
        }
      end


      def ogg_fetch file
        response = Net::HTTP.get_response(URI.parse("http://commons.wikimedia.org#{file[:path]}"))
        noko = Nokogiri::HTML.parse(response.body)
        real_path = noko.css('#mw-content-text .fullMedia a').attr('href').value
        sample = Sample.new({url: real_path, name: file[:name], description: 'From Wikimedia Commons' })
        sample.user = @wiki_user
        sample.save

        puts "sample created: #{sample.name}"
      end

      def seed!
        @wiki_user = User.create(alias: 'wikimediacommons', nickname: 'Wikimedia Commons')
        puts 'seeding from wikimedia'
        page = fetch_and_parse_page "http://commons.wikimedia.org/wiki/Category:Audio_files"
        page[:files].each do |file|
          ogg_fetch file
        end
      end

      

    end   
  end
end

