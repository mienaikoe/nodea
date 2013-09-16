class AddAttachmentFileToSamples < ActiveRecord::Migration
  def self.up
    change_table :samples do |t|
      t.attachment :file
    end
  end

  def self.down
    drop_attached_file :samples, :file
  end
end
