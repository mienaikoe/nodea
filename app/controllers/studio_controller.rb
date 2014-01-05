class StudioController < ApplicationController
  
  
  def index
    @project = Project.find(1)
  end
  
  def save
    if project = Project.find(params[:project_id])
      persist_project(project, params)
    else
      render json: {error: "Couldn't find project specified"}
    end
    render nothing: true
  end
  
  
  
  
  private
  
  
  
  @@PERSISTENCE_KEYS = ['name', 'description', 'beats_per_minute', 'beats_per_bar', 'keyset', 'bar_count']
  
  def persist_project project, params
    ActiveRecord::Base.transaction do
      project.update_attributes(params.select{|key,val| @@PERSISTENCE_KEYS.include?(key) })
      project.nodas.destroy_all
      
      params[:nodas].each do |noda|
        circuit = Circuit.find_by_handle(noda[:handle])
        
        newnoda = Noda.new(ordinal: noda[:ordinal], settings: noda[:settings].to_json)
        newnoda.circuit = circuit
        newnoda.project = project
        newnoda.save!
        
        if noda[:notes]
          noda[:notes].each do |note|
            note = Note.new(start: note[:start], finish: note[:finish])
            note.noda = newnoda
            note.save!
          end
        end
        
        project.nodas << newnoda
      end
      project.save!
    end
  end
  
  
  
end
