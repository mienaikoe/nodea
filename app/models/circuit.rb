class Circuit < ActiveRecord::Base
    
  validates_presence_of :name, :javascript_name, :description, :user_id, :filename

  belongs_to :user
  alias_attribute :author, :user
  
  has_many :nodas
  
  def location
    "/circuits/#{filename}"
  end
    
end
