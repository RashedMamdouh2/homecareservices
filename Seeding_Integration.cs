// Program.cs or Startup.cs - Add this to seed data on application startup

// In Configure method, after app.UseAuthorization();
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

            // Seed the database
            await DatabaseSeeder.SeedAsync(context, userManager, roleManager);

            Console.WriteLine("Database seeded successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error seeding database: {ex.Message}");
        }
    }
}

// Alternative: Create a separate seeding endpoint
app.MapPost("/api/admin/seed-database", async (
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) =>
{
    try
    {
        await DatabaseSeeder.SeedAsync(context, userManager, roleManager);
        return Results.Ok(new { message = "Database seeded successfully!" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.RequireAuthorization(policy => policy.RequireRole("Admin"));</content>
<parameter name="filePath">c:\mahmoud\HomeCare_new/Seeding_Integration.cs