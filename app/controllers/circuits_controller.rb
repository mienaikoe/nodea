class CircuitsController < ApplicationController
  before_action :set_circuit, only: [:show, :edit, :update, :destroy]

  # GET /circuits
  # GET /circuits.json
  def index
    @circuits = Circuit.all
  end

  # GET /circuits/1
  # GET /circuits/1.json
  def show
  end

  # GET /circuits/new
  def new
    @circuit = Circuit.new
  end

  # GET /circuits/1/edit
  def edit
  end

  # POST /circuits
  # POST /circuits.json
  def create
    #extract circuit file from params    
    @circuit = Circuit.new(circuit_params)
    puts '===================================================='
    puts @circuit.inspect

    respond_to do |format|
      if @circuit.save
        format.html { redirect_to @circuit, notice: 'Circuit was successfully created.' }
        format.json { render action: 'show', status: :created, location: @circuit }
      else
        format.html { render action: 'new' }
        format.json { render json: @circuit.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /circuits/1
  # PATCH/PUT /circuits/1.json
  def update
    respond_to do |format|
      if @circuit.update(circuit_params)
        format.html { redirect_to @circuit, notice: 'Circuit was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @circuit.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /circuits/1
  # DELETE /circuits/1.json
  def destroy
    @circuit.destroy
    respond_to do |format|
      format.html { redirect_to circuits_url }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_circuit
      @circuit = Circuit.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def circuit_params
      ret = params.require(:circuit)
      if ret.has_key? :code
        uploaded_io = ret[:code]
        File.open(Rails.root.join('public','circuits',uploaded_io.original_filename),'wb') do |file|
          file.write(uploaded_io.read)
        end
        ret[:file_url] = "/circuits/#{uploaded_io.original_filename}"
      end
      ret.permit(:name, :description, :user_id, :file_url)
    end
end
