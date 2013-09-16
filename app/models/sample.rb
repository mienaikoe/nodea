class Sample < ActiveRecord::Base
  
  attr_accessor :name, :description, :user, :file
  
  has_attached_file :file
  belongs_to :user
  
end
