class CreateProjects < ActiveRecord::Migration
  
  def change
    
    create_table :projects do |t|
      t.string :name
      t.text :description
      
      t.timestamps
    end
    
    
    create_table :users_projects, id: false do |t|
      t.integer :project_id
      t.integer :user_id
    end
    
  end
  
end
