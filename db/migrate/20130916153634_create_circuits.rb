class CreateCircuits < ActiveRecord::Migration
  def change
    create_table :circuits do |t|
      t.string :name
      t.string :handle
      t.text :description
      t.belongs_to :user

      t.timestamps
    end
    
    add_index :circuits, :handle, :unique => true
  end
  
end
