class Key < ActiveRecord::Base
  
  belongs_to :project
  has_one :circuit
  has_many :notes
  
  
  def to_hash
     {
       ordinal: key.ordinal, 
       input: key.settings,
       circuit: key.circuit.to_hash,  
       notes: key.notes.map{|note| note.to_hash }
     }
  end
end
