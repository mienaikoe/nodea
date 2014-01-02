class Circuit < ActiveRecord::Base
    
  validates_presence_of :name, :handle, :description, :user_id

  belongs_to :user
  alias_attribute :author, :user
  
  has_many :nodas
  
  def script
    "/circuits/#{handle}/#{handle}.js"
  end
  
  def image
    "/circuits/#{handle}/#{handle}.png"
  end
    
end
