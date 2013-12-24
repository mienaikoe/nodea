class CreateNodas < ActiveRecord::Migration
  
  def change
    
    create_table :nodas do |t|
      t.belongs_to :circuit
      t.belongs_to :project
      t.integer :ordinal
      t.text :settings
    end
    
    add_index :nodas, [:project_id, :circuit_id]
    
  end
end
