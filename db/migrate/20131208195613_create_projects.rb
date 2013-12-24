class CreateProjects < ActiveRecord::Migration
  
  def change
    
    create_table :projects do |t|
      t.string :name
      t.text :description
      t.integer :bpm
      t.integer :beat
      t.integer :beat_count
      t.string :keyset
      
      t.timestamps
    end
    
    
    create_join_table :users, :projects
        
    
  end
  
end
