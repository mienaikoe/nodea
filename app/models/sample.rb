class Sample < ActiveRecord::Base
  
  #attr_accessor :name, :description, :user, :file
  
  validates_presence_of :name, :description, :file
  
  has_attached_file :file
  belongs_to :user
  
end
