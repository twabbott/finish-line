﻿using AutoMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;

using FinishLineApi.Models;
using FinishLineApi.Services;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Repositories;
using FinishLineApi.Store.Entities;

namespace FinishLineApi
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            services.AddLogging(logging =>
            {
                logging.AddConsole();
                logging.AddDebug();
            });

            // Auto Mapper Configurations
            services.AddSingleton(AutoMapperProfile.MapperFactory());

            // SQL Server configuration.  We're using SQL Server localdb
            var connection = @"Server=(localdb)\mssqllocaldb;Database=FinishLine;Trusted_Connection=True;ConnectRetryCount=0";
            services.AddDbContext<IFinishLineDBContext, FinishLineDBContext>(options => options.UseSqlServer(connection));

            // DI mappings for all services
            services
                .AddScoped<IWorkNoteService, WorkNoteService>(); // Data services should have a scoped lifetime, not transient.

            // DI mappings for all repositories
            services
                .AddScoped<IGenericDbContext, FinishLineDBContext>()
                .AddScoped<IGenericRepository<WorkNote>, GenericRepository<WorkNote, FinishLineDBContext>>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IServiceProvider host)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler();
                app.UseHsts();
            }

            app.UseMvc();

            if (env.IsDevelopment())
            {
                IFinishLineDBContext dbContext = host.GetRequiredService<IFinishLineDBContext>();
                dbContext.CreateSeedData();
            }
        }
    }
}
