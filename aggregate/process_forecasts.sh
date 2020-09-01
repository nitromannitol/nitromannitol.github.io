echo "Processing IHME"
cd /home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/forecasts/IHME
julia process_ihme.jl

echo "Processing MIT"
cd /home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/forecasts/MIT
julia process_mit.jl

echo "Processing YYG"
cd /home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/forecasts/YYG
julia process_yyg_data.jl 


echo "Processing LANL"
cd /home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/forecasts/LANL
julia process_lanl_data.jl


echo "Processing Cases"
cd /home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/
julia process_cases.jl

echo "Processing Forecasts"

julia process_forecasts.jl


