echo "Processing IHME"
cd /home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/IHME
julia process_ihme.jl

echo "Processing MIT"
cd /home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/MIT
julia process_mit.jl

echo "Processing YYG"
cd /home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/YYG
julia process_yyg_data.jl 


echo "Processing LANL"
cd /home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/LANL
julia process_lanl_data.jl


echo "Processing Cases"
cd /home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/
julia process_cases.jl

echo "Processing Forecasts"

julia process_forecasts.jl


