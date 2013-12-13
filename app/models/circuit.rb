class Circuit < ActiveRecord::Base
    
  validates_presence_of :name, :description, :user_id, :file_url

  belongs_to :user
  belongs_to :key
  
  
  
  def to_hash
    {
      name: name,
      description: description,
      code: File.open(file_url, 'r').read(),
      author: {:alias => user.alias, :nickname => user.nickname}
    }
  end
  
end
