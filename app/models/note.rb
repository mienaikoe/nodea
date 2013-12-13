class Note < ActiveRecord::Base
  
  validates_existence_of :on, :off
  
  belongs_to :key
  belongs_to :project, through: :keys
  
  def to_hash
    {on: on, off: off}
  end
  
end
