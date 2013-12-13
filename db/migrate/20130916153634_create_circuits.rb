class CreateCircuits < ActiveRecord::Migration
  def change
    create_table :circuits do |t|
      t.string :name
      t.text :description
      t.belongs_to :user
      t.string :file_url

      t.timestamps
    end
  end
  
end
