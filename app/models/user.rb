class User < ActiveRecord::Base
  
  validates_presence_of :alias, :nickname
  validates_uniqueness_of :alias

  
  has_many :samples
  has_and_belongs_to_many :projects
  
end
