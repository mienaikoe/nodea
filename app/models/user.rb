class User < ActiveRecord::Base
  
  attr_accessor :password
  before_save :digest_password
  validates_confirmation_of :password
  validates_presence_of :password, :on => :create
  
  
  validates_presence_of :alias, :nickname
  validates_uniqueness_of :alias

  
  has_many :circuits
  has_and_belongs_to_many :projects
  
  def digest_password
    self.passdigest = Digest::SHA512.hexdigest(password) if password.present?
  end
  
end
