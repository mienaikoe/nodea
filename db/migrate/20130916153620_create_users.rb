class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :handle
      t.string :nickname
      t.string :passdigest
      t.string :email
      t.timestamps
    end
    
    add_index :users, :handle, :unique => true
    
  end
end
