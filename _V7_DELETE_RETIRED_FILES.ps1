$files = @(
  'src/commands/games/game.js','src/commands/games/tournaments.js','src/commands/games/seasonal.js',
  'src/services/tournamentService.js','src/services/seasonalService.js','src/services/seasonalNotifier.js',
  'src/modules/gameHub.js','src/modules/seasonal.js',
  'src/models/GameTournament.js','src/models/SeasonalEvent.js','src/models/SeasonalInventory.js','src/models/SeasonalAlertState.js',
  'src/models/GameHubProfile.js','src/models/WeeklyProgress.js','src/models/RankingRewardBatch.js'
)
foreach ($f in $files) { if (Test-Path $f) { Remove-Item $f -Force; Write-Host "Removed $f" } }
Write-Host 'V7 retired Game Hub / weekly ranking / tournament / seasonal files removed.'
