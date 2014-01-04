class Project < ActiveRecord::Base
  
  validates_presence_of :name, :description, :beats_per_minute, :beats_per_bar, :keyset, :bar_count

  has_and_belongs_to_many :users
  alias_attribute :authors, :users
  
  has_many :nodas, dependent: :destroy
  has_and_belongs_to_many :circuits, join_table: :nodas
  has_many :notes, through: :nodas
  
  
  def unique_circuits
    @unique_circuits ||= circuits.uniq{|circuit| circuit.id}
  end
    
end
