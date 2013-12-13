class CreateProjects < ActiveRecord::Migration
  
  def change
    
    create_table :projects do |t|
      t.string :name
      t.text :description
      t.integer :bpm
      t.integer :beat
      
      t.timestamps
    end
    
    
    create_join_table :users, :projects
        
    create_join_table :circuits, :projects, table_name: :keys do |t|
      t.integer :ordinal
      t.text :settings
    end
    
  end
  
end
