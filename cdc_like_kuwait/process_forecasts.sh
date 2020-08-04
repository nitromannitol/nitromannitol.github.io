echo "Processing IHME"
julia forecasts/IHME/process_ihme.jl

echo "Processing MIT"
julia forecasts/MIT/process_mit.jl

echo "Processing YYG"
julia forecasts/YYG/process_yyg_data.jl 


echo "Processing LANL"
julia forecasts/LANL/process_lanl_data.jl


echo "Processing Cases"

julia process_cases.jl

echo "Processing Forecasts"

julia process_forecasts.jl


