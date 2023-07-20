//
//  File.swift
//
//
//  Created by Jackson Harper on 6/29/23.
//

import Foundation
import Models
import Services
import SwiftUI

struct LibraryTabView: View {
  @EnvironmentObject var dataService: DataService

  @StateObject private var subViewModel = HomeFeedViewModel(
    listConfig: LibraryListConfig(
      hasFeatureCards: false,
      leadingSwipeActions: [.moveToInbox],
      trailingSwipeActions: [.archive, .delete],
      cardStyle: .library
    )
  )

  @StateObject private var libraryViewModel = HomeFeedViewModel(
    listConfig: LibraryListConfig(
      hasFeatureCards: true,
      leadingSwipeActions: [.pin],
      trailingSwipeActions: [.archive, .delete],
      cardStyle: .library
    )
  )

  @StateObject private var highlightsViewModel = HomeFeedViewModel(
    listConfig: LibraryListConfig(
      hasFeatureCards: true,
      leadingSwipeActions: [.pin],
      trailingSwipeActions: [.archive, .delete],
      cardStyle: .highlights
    )
  )

  var body: some View {
    NavigationView {
      ZStack {
        NavigationLink(
          destination: LinkDestination(selectedItem: libraryViewModel.selectedItem),
          isActive: $libraryViewModel.linkIsActive
        ) {
          EmptyView()
        }
        TabView {
          HomeView(viewModel: libraryViewModel)
            .tabItem {
              Label {
                Text("Subscriptions")
              } icon: {
                Image.tabSubscriptions
              }
            }.tag(1)

          HomeView(viewModel: libraryViewModel)
            .tabItem {
              Label {
                Text("Library")
              } icon: {
                Image.tabLibrary
              }
            }.tag(1)

          HomeView(viewModel: highlightsViewModel)
            .tabItem {
              Label {
                Text("Highlights")
              } icon: {
                Image.tabHighlights
              }
            }.tag(2)
        }
      }
    }
    .navigationViewStyle(.stack)
    .navigationBarTitleDisplayMode(.inline)
  }
}
