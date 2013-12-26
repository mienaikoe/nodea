class Project < ActiveRecord::Base
  
  validates_presence_of :name, :description, :bpm, :beat, :keyset, :beat_count

  has_and_belongs_to_many :users
  alias_attribute :authors, :users
  
  has_many :nodas
  has_and_belongs_to_many :circuits, join_table: :nodas
  has_many :notes, through: :nodas
  
  
  def unique_circuits
    @unique_circuits ||= circuits.uniq{|circuit| circuit.id}
  end
  
  @@PERSISTENCE_KEYS = [:bpm, :beat, :keyset, :beat_count]
  
  def persist params
    ActiveRecord::Base.transaction do
      self.update_attributes(params.select{|key,val| @@PERSISTENCE_KEYS.include?(key) })
      self.nodas.destroy_all
      
      params[:nodas].each do |noda|
        circuit = Circuit.find_by_javascript_name(noda[:javascript_name])
        
        newnoda = Noda.new(ordinal: noda[:ordinal], settings: noda[:settings].to_json)
        newnoda.circuit = circuit
        newnoda.project = self
        newnoda.save!
        
        if noda[:notes]
          noda[:notes].each do |note|
            note = Note.new(start: note[:start], finish: note[:finish])
            note.noda = newnoda
            note.save!
          end
        end
        
        self.nodas << newnoda
      end
      self.save!
    end
  end
    
end
