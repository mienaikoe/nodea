class Project < ActiveRecord::Base
  
  validates_presence_of :name, :description, :bpm, :beat, :keyset, :beat_count

  has_and_belongs_to_many :users
  alias_attribute :authors, :users
  
  has_many :nodas
  has_and_belongs_to_many :circuits, join_table: :nodas
  has_many :notes, through: :nodas
  
    
end
