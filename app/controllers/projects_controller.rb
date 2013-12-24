class ProjectsController < ApplicationController
  
  
  before_action :set_project, only: [:show, :edit, :update, :destroy]
  
  
  def index
    @projects = Project.all
  end

  def show
  end
  
  def new
    @project = Project.new
  end
  
  def create
    @project = Project.new(project_params)

    respond_to do |format|
      if @project.save
        format.html { redirect_to @project, notice: 'User was successfully created.' }
        format.json { render action: 'show', status: :created, location: @project }
      else
        format.html { render action: 'new' }
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end
  
  
  private

    def set_project
      @project = Project.find(params[:id])
    end
  
    # Never trust parameters from the scary internet, only allow the white list through.
    def project_params
      params.require(:project).permit(:name, :description, :bpm, :beat)
    end
  
end