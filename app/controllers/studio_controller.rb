class StudioController < ApplicationController
  
  KEYS = [
    '1','2','3','4','5','6','7','8','9','0',
    'q','w','e','r','t','y','u','i','o','p',
    'a','s','d','f','g','h','j','k','l',';',
    'z','x','c','v','b','n','m',',','.','/'
  ]
  
  def index
    # Load requested song if exists
   
    # Determine what platform user is on from session
   
    # Determine which view to render based on platform
    
    
    @keys ||= KEYS
    
    @bindings = []
    @keys.each_with_index do |k,i|
      @bindings[k.ord] = 'http://upload.wikimedia.org/wikipedia/commons/3/33/ConstantSpectrumMelody.ogg';
      break if i>1
    end
    @project = {
      bindings: @bindings,
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
      keySet: 'desktop',
      beat: 4,
      numBeats: 24,
      bpm: 144
    }

    
#    @project = Project.find_by_id(1)
    
    render 'desktop'
  end
  
  
  
 
end
