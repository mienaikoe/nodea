class CreateCircuits < ActiveRecord::Migration
  def change
    create_table :circuits do |t|
      t.string :name
      t.string :javascript_name
      t.string :background_image
      t.text :description
      t.belongs_to :user
      t.string :filename

      t.timestamps
    end
  end
  
end
