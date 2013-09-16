class CreateSamples < ActiveRecord::Migration
  def up
    create_table :samples do |t|
      t.string :name
      t.text :description
      t.belongs_to :user

      t.timestamps
    end
  end
  
  def down
    drop_table :samples
  end
  
end
