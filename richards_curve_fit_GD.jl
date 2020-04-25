using PyPlot
using Distributions 

function f(t,B0,B1,B2,B3) 
	return B0/(1 + B1*exp(-B2*t))^(1/B3);
end

function fitCurveGD(num_iters1, num_iters2, y; eps = 0.001, B0 = Inf, B1 = Inf, B2 = Inf, B3 = Inf)
	num_days = length(y);

	## initialize values  according to 
	## https://web.archive.org/web/20110929005929/http://www.metla.fi/silvafennica/full/sf33/sf334327.pdf
	max_diff = -Inf;
	t1_true = Inf;
	t2_true = Inf; 

	for t1 in 1:num_days
		for t2 in t1:num_days
			z = (y[t2]-y[t1])/(t2-t1); 
			if( z > max_diff)
				max_diff = z
			end
		end
	end
	B_true = [];
	min_error = Inf; 

	for kk in 1:num_iters1

		#cold start 
		if(B0 == Inf)
			B0 = (1 + rand(Poisson(1)))*maximum(y);
			B2 = max_diff/B0; 
			B3 = Float64(1+rand(Poisson(1)))
			B1 = (B0/y[1])^(B3)-1; 
			## truncate B1 
			#B1 = min(B1, 10)
		else
			#start with the given values 
		end

		B_ = [B0; B1; B2; B3];
		B_start = copy(B_);

		for i in 1:num_iters2
			curr_resid = [f(t,B0,B1,B2,B3)-y[t] for t in 1:num_days]
			curr_error = norm(curr_resid,2)/norm(y,2);
			if(curr_error < min_error)
				min_error = curr_error
				B_true = B_;
			end

			#if you get super far from a minimum just restart before getting 
			#floating point errors
			#if(curr_error > 10^2)
			#	B_ = B_start;
			#	B0 = B_[1]; B1 = B_[2]; B2 = B_[3]; B3 = B_[4]; 
			#end


			curr_grad = Float64.([0; 0; 0; 0]);
			for t in 1:num_days
				curr_grad[1] += curr_resid[t]*(1+B1*exp(-B2*t))^(-1/B3)
				curr_grad[2] += curr_resid[t]*( (-B0/B3)*(1 + B1*exp(-B2*t))^(-1/B3-1)*exp(-B2*t))
				curr_grad[3] += curr_resid[t]*(B0*B1*t/B3)*(1 + B1*exp(-B2*t))^(-1/B3-1)*exp(-B2*t)
				curr_grad[4] += curr_resid[t]*(B0)*(1+B1*exp(-B2*t)^(-1/B3))*log(1+B1*exp(-B2*t))*B3^(-2);
			end

		
			#to help get out of local minima
			#error = rand(Normal(1),4); error = error./norm(error,2);
			#curr_grad = curr_grad + error

			#temper the gradient 
			B_ = B_ - (1/i)*curr_grad/(norm(curr_grad,2))
			B0 = B_[1]; B1 = B_[2]; B2 = B_[3]; B3 = B_[4]; 
		end

	end
	
	return B_true, min_error

end



data = readcsv("/Users/ahmedbou-rabee/Desktop/Corona_Kuwait/nitromannitol.github.io/data_fit.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])
num_days = length(count);


extra_days = 14; 




y_true = copy(count);
y_true = y_true[1:end-extra_days]

y = copy(count); 
train_window = length(y_true)-7;
train_window = 40; 
y = y_true[1:train_window];

num_iters1 = 100;
num_iters2 = 100; 


@time B_true, min_error = fitCurveGD(num_iters1, num_iters2,y)
B0 = B_true[1]; B1 = B_true[2]; B2 = B_true[3]; B3 = B_true[4]; 

clf()


num_days = length(y_true)+extra_days
#num_days = length(y)+7
f_t = [f(t,B0,B1,B2,B3) for t in 1:num_days]
close("all")
plot(f_t, label = "Sigmoid fit")
#scatter(1:length(y), y, label = "Kuwait Data")
#scatter(1:length(y), y, label = "Kuwait Data")
plot(y_true, label = "Kuwait Data")
title("Sigmoid fit on first 40 days");
xlabel("Days since Feb 25");
ylabel("Confirmed cases")
legend()



A = NaN*zeros(length(y_true),num_days);
param_vec = [];

num_iters1 = 100;
num_iters2 = 100; 
num_iters0= 5
A[1,1] = y[1]; 

B_prev = []


for t in 2:length(y_true)
	y = y_true[1:t]
	isLoop = true
	min_error = Inf;
	B_true = []; 
	if(t > 2)
		isLoop = true; 
		while(isLoop)
			try
				@time BB, MM = fitCurveGD(num_iters1, num_iters2,y, B0 = B_prev[1], B1 = B_prev[2], B2 = B_prev[3], B3 = B_prev[4])
				min_error = MM;
				B_true = BB; 
				isLoop = false
			catch e 
				isLoop = true
			end
		end
	end
	isLoop = true; 
	@time begin 
		for k in 1:num_iters0
			while(isLoop)
				try 
					BB, MM = fitCurveGD(num_iters1, num_iters2,y)
					if(MM < min_error)
						B_true = BB;
						min_error = MM;
					end
					isLoop  = false; 
				catch e
					isLoop = true
				end
			end
		end
	end
	B0 = B_true[1]; B1 = B_true[2]; B2 = B_true[3]; B3 = B_true[4]; 
	f_t = [f(t,B0,B1,B2,B3) for t in 1:num_days]
	A[t,1:t+extra_days] = f_t[1:t+extra_days]; 
	push!(param_vec, B_true)
	B_prev = B_true; 
end

param_mat = zeros(length(y_true),4);

for t in 2:length(y_true)
	param_mat[t,:] = param_vec[t-1];
end



writecsv("richard_fit.csv",[param_mat A])
AA = readcsv("richard_fit.csv")



## writedown the Richards curve





#fit richards growth model by gradient descent




