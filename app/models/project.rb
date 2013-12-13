class Project < ActiveRecord::Base
  
  validates_presence_of :name, :description, :bpm, :beat

  has_and_belongs_to_many :users
  
  has_many :keys
  has_and_belongs_to_many :circuits, join_table: :keys
  has_many :notes, through: :keys
  
  
  
  def to_hash
    {
      name: name,
      description: description,
      bpm: bpm,
      beat: beat,
      authors: users.map{|user| user.nickname },
      keys: keys.map{|key| key.to_hash }
    }
  end
  
  def to_json
    self.to_hash.to_json
  end
  
end
