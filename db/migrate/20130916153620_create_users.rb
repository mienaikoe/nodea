class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :alias
      t.string :nickname
      t.string :passdigest
      t.string :email
      t.timestamps
    end
    
    add_index :users, :alias, :unique => true
    
  end
end
