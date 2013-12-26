class StudioController < ApplicationController
  
  
  def index
    # Load requested song if exists
   
    # Determine what platform user is on from session
   
    # Determine which view to render based on platform
    
    @project = Project.find(1)

  end
  
  def save
    if project = Project.find(params[:project_id])
      project.persist(params)
    end
    
    puts project.nodas.first.notes.inspect
    
    render nothing: true
  end
  
  
  
 
end
