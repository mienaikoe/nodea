class Note < ActiveRecord::Base
  
  validates_presence_of :on, :off, :noda_id
  
  belongs_to :noda
  
end
