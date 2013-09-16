class User < ActiveRecord::Base
  
  attr_accessor :alias, :nickname, :avatar
  
  has_attached_file :avatar #, :styles => { :medium => "300x300>", :thumb => "100x100>" } needs imagemagick, but there are many issues with it
  has_many :samples
  
end
