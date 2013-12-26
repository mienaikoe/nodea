# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

ActiveRecord::Base.transaction do
  
  user = User.create(:alias=>'mienaikoe', :nickname=>'Jesse', :password=>'3325862', :password_confirmation=>'3325862')

  project = Project.new(name: 'Test Project', description: 'Initial Project for Testing purposes', bpm: 144, beat: 4, keyset: 'desktop', beat_count: 20)
  project.users << user
  project.save

  circuit = Circuit.new(name: 'Sampler', javascript_name: 'Sampler', description: 'Play the audio from a source file on keydown. Stops on keyup.', filename: 'sampler.js')
  circuit.user = user
  circuit.save

  key_settings = {sourceFile: 'http://upload.wikimedia.org/wikipedia/commons/3/33/ConstantSpectrumMelody.ogg'}.to_json
  (49..51).each do |ord|
    noda = Noda.new(ordinal: ord, settings: key_settings)
    noda.project = project
    noda.circuit = circuit
    noda.save
    
    note = Note.new(start: ord+1, finish: ord+24)
    note.noda = noda
    note.save
  
    note = Note.new(start: ord+34, finish: ord+68)
    note.noda = noda
    note.save
  end


  
end