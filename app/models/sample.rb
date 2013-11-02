class Sample < ActiveRecord::Base
  
  validates_presence_of :name, :description, :url, :user_id

  belongs_to :user
  
end
