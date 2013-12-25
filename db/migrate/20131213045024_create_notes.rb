class CreateNotes < ActiveRecord::Migration
  def change
    create_table :notes, id: false do |t|
      t.belongs_to :noda
      t.integer :start
      t.integer :finish
    end
  end
end
