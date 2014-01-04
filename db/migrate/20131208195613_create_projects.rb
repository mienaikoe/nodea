class CreateProjects < ActiveRecord::Migration
  
  def change
    
    create_table :projects do |t|
      t.string :name
      t.text :description
      t.integer :beats_per_minute
      t.integer :beats_per_bar
      t.integer :bar_count
      t.string :keyset
      
      t.timestamps
    end
    
    
    create_join_table :users, :projects
        
    
  end
  
end
