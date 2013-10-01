class StudioController < ApplicationController
  
  KEYS = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.','/']
  ]
  
  def index
    # Load requested song if exists
   
    # Determine what platform user is on from session
   
    # Determine which view to render based on platform
    
    samples = Sample.find_all_by_user_id(1)
    @keys ||= KEYS
    
    @samples = []
    @keys.flatten.each_with_index do |k,i|
      @samples[k.ord] = samples[i];
    end
        
    @project = {
      bindings: @samples.map{|s|s ? s.file.url : nil},
      timings: [ 
          { key: '1', on: 0,   off: 24},
          { key: '2', on: 32,  off: 48},
          { key: '1', on: 48,  off: 95},
          { key: '3', on: 72,  off: 95},
          { key: '1', on: 96,  off: 143},
          { key: '3', on: 96,  off: 108},
          { key: '1', on: 288, off: 480},
          { key: '2', on: 144, off: 480},
      ],
      beat: 4,
      numBeats: 81,
      bpm: 144
    }
    
    render 'desktop'
  end
  
  
  
 
end
