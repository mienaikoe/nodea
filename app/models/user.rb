require 'rasem'

class User < ActiveRecord::Base
  
  attr_accessor :password
  before_save :digest_password
  validates_confirmation_of :password
  validates_presence_of :password, :on => :create
  
  
  validates_presence_of :alias, :nickname
  validates_uniqueness_of :alias

  
  has_many :circuits
  has_and_belongs_to_many :projects
  
  def digest_password
    self.passdigest = Digest::SHA512.hexdigest(password) if password.present?
  end
  
  def svg_representation dimension=50
    hexrep = Digest::SHA256.hexdigest(self.alias)

    choke = 0
    columns = 32
    
    img = Rasem::SVGTag.new('svg', {width: dimension, height: dimension}) do
      angle = 0
      hexrep.chars.each_slice(2) do |chunk|
        length = (chunk.slice(0,2).join('').to_i(16) * dimension / 256) * 0.5
        origin = [(choke*Math.cos(angle))+(dimension/2), (choke* Math.sin(angle))+(dimension/2)]
        target = [length * Math.cos(angle)+(dimension/2), length* Math.sin(angle)+(dimension/2)]
        
        first_num = chunk[0].to_i(16)
        second_num = chunk[1].to_i(16)
        sum = first_num+second_num        
        if(sum > 22)
          color = "##{chunk[0]}f#{chunk[1]}"
        elsif(sum > 11)
          color = "#ff#{chunk[0]}f#{chunk[1]}f"
        else
          color = "##{sum}fffff"
        end
        
        styling = {:stroke => color, :stroke_width => 1}
        line origin[0], origin[1], target[0], target[1], styling
        
        angle += (Math::PI / (columns/2))
      end
    end
    img.write('')
  end
  
end
