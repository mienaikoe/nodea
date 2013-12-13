class CreateNotes < ActiveRecord::Migration
  def change
    create_table :notes, id: false do |t|
      t.integer :key_id
      t.integer :on
      t.integer :off
    end
  end
end
