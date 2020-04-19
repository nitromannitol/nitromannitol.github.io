using PyPlot

data = readcsv("data_fit.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])
num_days = length(count);

y_true = copy(count);
y = copy(count); 
train_window = length(y_true);
y = y_true[1:train_window];
num_days = length(y)



#fit function by grid search 
grid_size = 30; 
B0_s = linspace(maximum(y),maximum(y)*10,grid_size)
B1_s = linspace(0,10,grid_size)
B2_s = linspace(0,10,grid_size)
B3_s = linspace(0,10,grid_size);
e = Inf; 

B0_hat = Inf; B1_hat = Inf; B2_hat = Inf; B3_hat = Inf;

@time begin 
	for i in 1:grid_size
		for ii in 1:grid_size
			for j in 1:grid_size
				for jj in 1:grid_size
					B_0 = B0_s[i];
					B_1 = B1_s[ii];
					B_2 = B2_s[j];
					B_3 = B3_s[jj];

					f_t = [B_0/(1 + B_1*exp(-B_2*t))^(1/B_3) for t in 1:num_days]

					curr_e = norm(f_t - y,2)/norm(y,2)
					if(curr_e < e)
						e = curr_e
						B0_hat = B_0
						B1_hat = B_1;
						B2_hat = B_2;
						B3_hat = B_3;
					end

				end
			end
		end
	end
end

B0 = B0_hat; B1 = B1_hat; B2 = B2_hat; B3 = B3_hat; 
function f(t,B0,B1,B2,B3) 
	return B0/(1 + B1*exp(-B2*t))^(1/B3);
end

num_days = length(y_true)
f_t = [f(t,B0,B1,B2,B3) for t in 1:num_days]
close("all")
plot(f_t)
plot(y_true)





