class Noda < ActiveRecord::Base
  
  validates_presence_of :ordinal, :settings, :project_id, :circuit_id
  
  belongs_to :project
  belongs_to :circuit
  has_many :notes, dependent: :destroy
  
  
end
