class Note < ActiveRecord::Base
  
  validates_presence_of :start, :finish, :noda_id
  
  belongs_to :noda
  
end
